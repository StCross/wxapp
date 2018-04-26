
import difference from '../lib/lodash.difference/index';
import assign from '../lib/object-assign';

import ADGMatrixGraph from './ADGMatrixGraph';
import {app_option, tree_option} from '../config/config';

const options = tree_option;

class TreeGraph {
    constructor(person_infos) {

        //
        // 每一层的左右边界
        //
        this.edge_infos = {
            "1": {"left_edge": 0, "right_edge": 0},
            "2": {"left_edge": 0, "right_edge": 0},
            "3": {"left_edge": 0, "right_edge": 0},
            "4": {"left_edge": 0, "right_edge": 0},
            "5": {"left_edge": 0, "right_edge": 0},
            "6": {"left_edge": 0, "right_edge": 0},
            "7": {"left_edge": 0, "right_edge": 0}
        };

        this.person_infos = person_infos || {};

        this.graph = new ADGMatrixGraph([], [], 0, 0);

        this.person_infos.personList.map((person_id) => {
            this.graph.addVertex(person_id);
        });

        this.person_infos.personRelationList.map((person_relation) => {
            const parent_id = person_relation.id
            const child_id = person_relation.child
            if (parent_id && child_id && this.person_infos.persons[parent_id] && this.person_infos.persons[child_id]) {
                this.graph.addArc(parent_id, child_id, { adj: 1 });
            }
        });

        this.connection_lines = [];

        //其格式： {
        //    'person_id': {
        //        top: 0,
        //        level: 0,
        //        left: 0,
        //        isPositioned: true
        //    }
        //};
        this.person_positions = {};

        //
        //其格式： {
        //    'person_id': {
        //        'id': '',
        //        'children': ''
        //    }
        //};
        this.single_children = {};

        //其格式：{
        //    'person_id': {
        //        'loverId': '',
        //        'children': '',
        //        'formerLovers': []
        //    }
        //};
        this.shared_children = {};

        this.window_width = 0;
        this.window_height = 0;

        this.figureOutSingleAndSharedChildren();
    }

    getPersonPositions() {
        return this.person_positions;
    }

    getConnectLines() {
        return this.connection_lines;
    }

    setWindowWidthAndHeight(width, height) {
        this.window_height = height;
        this.window_width = width;
    }

    //
    // 检测是否已婚
    //
    isMarried(person_id) {
        const personMarriageInfo = this.person_infos.personMarriageInfo;
        return (personMarriageInfo[person_id] && personMarriageInfo[person_id].mainLoverId);
    }

    //
    // 检测是否有婚姻关系存在
    //
    hasMarriageRelation(person_id) {
        const personMarriageInfo = this.person_infos.personMarriageInfo;
        return (personMarriageInfo[person_id]);
    }

    //
    // 获取主配偶id
    //
    getPrimaryPartnerId(person_id) {
        if (!this.isMarried(person_id)) {
            return;
        }

        const personMarriageInfo = this.person_infos.personMarriageInfo;

        if (!personMarriageInfo[person_id].mainLoverId) {
            return;
        }

        return personMarriageInfo[person_id].mainLoverId;
    }

    //
    // 获取除主配偶外其他配偶的id，list形式返回
    //
    getSecondaryPartnerIds(person_id) {
        if (!this.hasMarriageRelation(person_id)) {
            return;
        }

        const personMarriageInfo = this.person_infos.personMarriageInfo;

        if (!personMarriageInfo[person_id].formerLovers) {
            return;
        }

        return personMarriageInfo[person_id].formerLovers;
    }

    //
    // 检测人物是否可以被安全删除
    //
    isRemovable(person_id, user_id) {
        if (person_id === user_id) {
            return false;
        }

        const {father_id, mother_id} = this.getParentId(person_id);

        const primary_partner_id = this.getPrimaryPartnerId(person_id);

        if (primary_partner_id) {
            return (!father_id && !mother_id);
        }

        const child_list = this.getChildList(person_id);

        //const child_list_without_me = child_list.filter((child_id, i) => {
        //    return child_id !== user_id;
        //});

        const blood_relation_count = child_list.length + (father_id || mother_id ? 1 : 0);

        if (blood_relation_count > 1) {
            return false;
        }

        //const primary_lover_id = this.getPrimaryPartnerId(person_id);
        //const secondary_lover_ids = this.getSecondaryPartnerIds(person_id);
        //
        //const marriage_relation_count =
        //    (secondary_lover_ids && secondary_lover_ids.length ? secondary_lover_ids.length : 0) +
        //    (primary_lover_id ? 1 : 0);
        //
        //if (marriage_relation_count > 1) {
        //    return false;
        //}
        //
        //if (blood_relation_count + marriage_relation_count > 1) {
        //    return false;
        //}

        return true;
    }

    //
    // 人物删除后的活跃人物id（一般与待删除人物有所关联）
    //
    getNextActivePersonIdAfterRemove(person_id) {
        const {father_id, mother_id} = this.getParentId(person_id);
        if (father_id || mother_id) {
            return father_id || mother_id;
        }

        const child_list = this.getChildList(person_id);
        if (child_list.length === 1) {
            return child_list[0];
        }

        const primary_lover_id = this.getPrimaryPartnerId(person_id);

        if (primary_lover_id) {
            return primary_lover_id;
        }

        const secondary_lover_ids = this.getSecondaryPartnerIds(person_id);
        if (secondary_lover_ids && secondary_lover_ids.length === 1) {
            return secondary_lover_ids.first();
        }
    }

    //
    // 检测是否已经就位
    //
    isPositioned(person_id) {
        return (this.person_positions[person_id] && this.person_positions[person_id].isPositioned);
    }

    isMarriageExpandable(person_id) {
        const personMarriageInfo = this.person_infos.personMarriageInfo;

        if (!personMarriageInfo[person_id] || !personMarriageInfo[person_id].formerLovers) {
            return false;
        }

        return (personMarriageInfo[person_id].formerLovers.length !== 0);
    }

    isUpExpandable(person_id) {
        const {father_id, mother_id} = this.getParentId(person_id);

        return (father_id || mother_id);
    }

    isDownExpandable(person_id) {
        if (this.single_children[person_id] && this.single_children[person_id].children.length > 0) {
            return true;
        }

        if (this.shared_children[person_id] && this.shared_children[person_id].children.length > 0) {
            return true;
        }

        return false;
    }

    //
    // 获取配偶延伸方向
    // @return: 'left' or 'right'
    //
    getPartnerDisplaySide(person_id) {
        if (this.person_infos.persons[person_id] && this.person_infos.persons[person_id].sex &&
                this.person_infos.persons[person_id].sex === 'male') {
            return 'right';
        }

        return 'left';
    }

    //
    // 获取父母id
    //
    getParentId(person_id) {
        let father_id = '';
        let mother_id = '';

        const child_vex_index = this.graph.locateVex(person_id);
        if (child_vex_index !== -1) {
            for (let i = 0; i < this.graph.vexnum; ++i) {
                if (this.graph.arcs[i][child_vex_index].adj !== 0) {
                    if (this.person_infos.persons[this.graph.vexs[i]].sex &&
                        this.person_infos.persons[this.graph.vexs[i]].sex !== 'male') {
                        if (mother_id === '') {
                            mother_id = this.graph.vexs[i];
                        } else {
                            father_id = this.graph.vexs[i];
                        }
                    } else {
                        father_id = this.graph.vexs[i];
                    }
                }
            }
        }

        return {
            father_id,
            mother_id
        }
    }

    //
    // 获取子女列表
    //
    getChildList(person_id) {
        let child_list = [];

        const person_vex_index = this.graph.locateVex(person_id);
        if (person_vex_index !== -1) {
            for (let i = 0; i < this.graph.vexnum; ++i) {
                if (this.graph.arcs[person_vex_index][i].adj !== 0) {
                    child_list.push(this.graph.vexs[i]);
                }
            }
        }

        return child_list;
    }

    //
    // 获取夫妻双方共同子女列表
    //
    getSharedChildListFromGraph(parent_1_id, parent_2_id) {
        let child_list = [];
        const parent_1_vex_index = this.graph.locateVex(parent_1_id);
        const parent_2_vex_index = this.graph.locateVex(parent_2_id);

        if (parent_1_vex_index === -1 || parent_2_vex_index === -1) {
            return child_list;
        }

        for (let i = 0; i < this.graph.vexnum; ++i) {
            if (this.graph.arcs[parent_1_vex_index][i].adj !== 0 &&
                this.graph.arcs[parent_2_vex_index][i].adj !== 0) {
                child_list.push(this.graph.vexs[i]);
            }
        }

        return child_list;
    }

    getSharedChildList(parent_1_id, parent_2_id) {
        if (!parent_1_id || !parent_2_id) {
            return [];
        }

        if (this.shared_children[parent_1_id] && (this.shared_children[parent_1_id].loverId === parent_2_id)) {
            return this.shared_children[parent_1_id].children;
        }

        if (this.shared_children[parent_2_id] && (this.shared_children[parent_2_id].loverId === parent_1_id)) {
            return this.shared_children[parent_2_id].children;
        }

        return [];
    }

    //
    // 获取单方子女列表
    //
    getSingleChildList(person_id) {
        if (this.single_children[person_id] && this.single_children[person_id].children) {
            return this.single_children[person_id].children;
        }

        return [];
    }

    //
    // 获取子辈占据的总宽度以及中心相对最左侧的偏移量
    //
    getChildrenWidthAndCenterOffset(child_list) {
        let left = 0;
        let center = 0;
        child_list.map((child_id, i) => {
            if (this.isMarried(child_id)) {
                center += (this.getPartnerDisplaySide(child_id) === 'right') ?
                    (left + options.person_width / 2) :
                    (left + options.person_width * 1.5 + options.marriage_margin);

                left += ((options.person_width * 2 + options.marriage_margin) + options.person_margin);
            } else {
                center += (left + options.person_width / 2);
                left += (options.person_width + options.person_margin);
            }
        });

        if (child_list.length !== 0) {
            center = center / child_list.length;
        }

        return {
            width: left - options.person_margin,
            center: center
        }
    }

    getCenterOffset(person_id) {
        let center_offset = 0;

        if (this.isMarried(person_id) && (this.getPartnerDisplaySide(person_id) === 'left')) {
            center_offset = options.person_width * 1.5 + options.marriage_margin;
        } else {
            center_offset = options.person_width / 2;
        }

        return center_offset;
    }

    getChildCenterOffset(person_id) {
        let center_offset = 0;

        if (this.isMarried(person_id)) {
            if (this.getPartnerDisplaySide(person_id) === 'left') {
                center_offset = -(options.marriage_margin / 2);
            } else {
                center_offset = options.person_width + options.marriage_margin / 2;
            }
        } else {
            center_offset = options.person_width / 2;
        }

        return center_offset;
    }

    getChildrenAndGrandChildrenRelativeEdges(person_id) {
        const is_married = this.isMarried(person_id);

        const partner_id = is_married ? this.getPrimaryPartnerId(person_id) : '';

        const center = this.getChildCenterOffset(person_id);

        const child_list = (is_married && partner_id) ?
            this.getSharedChildList(person_id, partner_id) : this.getSingleChildList(person_id);

        if (!child_list || !child_list.length) {
            return;
        }

        const children_options = {};

        const { width: children_width, center: children_center_offset } =
            this.getChildrenWidthAndCenterOffset(child_list);

        // 先不考虑重叠，初步定位儿子辈及孙子辈的边界
        let children_left = center - children_center_offset;
        let total_width = 0;
        child_list.map((child_id, i) => {
            const child_width = this.isMarried(child_id) ?
                (options.person_width * 2 + options.marriage_margin) :
                options.person_width;

            const center_offset = this.getCenterOffset(child_id);

            const child_option = {
                left: children_left,
                right: children_left + child_width,
                center: children_left + center_offset,
                children_center: children_left + child_width / 2
            };

            children_left += (child_width + options.person_margin);

            const child_partner_id = this.getPrimaryPartnerId(child_id);
            const grandchild_list = this.isMarried(child_id) ? this.getSharedChildList(child_id, child_partner_id) :
                this.getSingleChildList(child_id);

            const { width: grandchildren_width, center: grandchildren_center_offset } =
                this.getChildrenWidthAndCenterOffset(grandchild_list);

            const grandchildren_left = child_option.children_center - grandchildren_center_offset;
            child_option.children_left = grandchildren_left;
            child_option.children_right = grandchildren_left + grandchildren_width;

            child_option.max_left = Math.min(child_option.left, child_option.children_left);
            child_option.max_right = Math.max(child_option.right, child_option.children_right);

            total_width += (child_option.max_right - child_option.max_left);

            children_options[child_id] = child_option;
        });

        // 统一向左偏移，以消除重叠
        children_left = center - total_width / 2;
        let children_center_new = 0;

        child_list.map((child_id, i) => {
            const child_option = children_options[child_id];
            const offset = child_option.max_left - children_left;

            child_option.left -= offset;
            child_option.right -= offset;
            child_option.center -= offset;
            child_option.children_center -= offset;
            child_option.children_left -= offset;
            child_option.children_right -= offset;
            child_option.max_left -= offset;
            child_option.max_right -= offset;

            children_left += (child_option.max_right - child_option.max_left + options.person_margin);

            children_center_new += child_option.center;
        });

        // 统一偏移，以使儿子辈的中心重新落在正中央
        children_center_new = children_center_new / child_list.length;

        const offset = children_center_new - center;
        child_list.map((child_id, i) => {
            const child_option = children_options[child_id];

            child_option.left -= offset;
            child_option.right -= offset;
            child_option.center -= offset;
            child_option.children_center -= offset;
            child_option.children_left -= offset;
            child_option.children_right -= offset;
            child_option.max_left -= offset;
            child_option.max_right -= offset;

            if (i === 0) {
                children_options.left_edge = child_option.left;
                children_options.children_left_edge = child_option.children_left;
                children_options.max_left = child_option.max_left;
            }
            if (i === child_list.length - 1) {
                children_options.right_edge = child_option.right;
                children_options.children_right_edge = child_option.children_right;
                children_options.max_right = child_option.max_right;
            }
        });

        return children_options;
    }

    //
    // 分离单独子女与夫妻共同子女，分别存于this.single_children及this.shared_children
    //
    figureOutSingleAndSharedChildren() {
        const personList = this.person_infos.personList;

        personList.map((person_id) => {
            let single_child_list = this.getChildList(person_id);

            if (this.hasMarriageRelation(person_id)) {
                // 主配偶
                const partner_id = this.getPrimaryPartnerId(person_id);

                if (partner_id) {
                    const partner_child_list = this.getSharedChildListFromGraph(partner_id, person_id);

                    this.shared_children[person_id] = {
                        loverId: partner_id,
                        children: partner_child_list,
                        formerLovers: []
                    };

                    single_child_list = difference(single_child_list, partner_child_list);
                }

                // 其他配偶
                const secondary_partner_list = this.getSecondaryPartnerIds(person_id);
                if (secondary_partner_list) {
                    if (!this.shared_children[person_id]) {
                        this.shared_children[person_id] = {
                            loverId: '',
                            children: [],
                            formerLovers: []
                        };
                    }

                    secondary_partner_list.map((partner_id) => {
                        const secondary_partner_child_list = this.getSharedChildListFromGraph(partner_id, person_id);

                        this.shared_children[person_id].formerLovers.push({
                            id: partner_id,
                            children: secondary_partner_child_list
                        });

                        single_child_list = difference(single_child_list, secondary_partner_child_list);
                    });
                }
            }

            this.single_children[person_id] = {
                id: person_id,
                children: single_child_list
            };
        });
    }

    drawSingleChildLine(parent_id, child_id) {
        //console.log("TimeGraph, drawSingleChildLine, parent_id:", parent_id, "child_id", child_id);

        const parent_line_left = this.person_positions[parent_id].left + options.person_width / 2;
        const parent_line_top = this.person_positions[parent_id].top + options.person_height;
        const child_line_left = this.person_positions[child_id].left + options.person_width / 2;
        const child_line_top = this.person_positions[child_id].top;

        this.connection_lines.push({
            type: "child",
            x1: parent_line_left,
            x2: parent_line_left,
            y1: parent_line_top,
            y2: child_line_top - 20,
            direction: 'vertical'
        });

        this.connection_lines.push({
            type: "child",
            x1: parent_line_left > child_line_left ? child_line_left : parent_line_left,
            x2: parent_line_left > child_line_left ? parent_line_left : child_line_left,
            y1: child_line_top - 20,
            y2: child_line_top - 20,
            direction: 'horizontal'
        });

        this.connection_lines.push({
            type: "child",
            x1: child_line_left,
            x2: child_line_left,
            y1: child_line_top - 20,
            y2: child_line_top,
            direction: 'vertical'
        });
    }

    drawMarriageLine(person_id, lover_id) {
        const center_left = (this.person_positions[person_id].left +
            this.person_positions[lover_id].left + options.person_width) / 2;
        const center_top = this.person_positions[person_id].top + options.person_height / 2 + 6;

        this.connection_lines.push({
            type: 'marriage',
            x1: center_left - options.marriage_margin / 2,
            x2: center_left + options.marriage_margin / 2,
            y1: center_top,
            y2: center_top,
            direction: 'horizontal'
        });
    }

    drawSharedChildLine(parent_id_1, parent_id_2, child_id) {
        const parent_line_left = (this.person_positions[parent_id_1].left +
            this.person_positions[parent_id_2].left + options.person_width) / 2;
        const parent_line_top = this.person_positions[parent_id_1].top + options.person_height / 2 + 6;

        const child_line_left = this.person_positions[child_id].left + options.person_width / 2;
        const child_line_top = this.person_positions[child_id].top;

        this.connection_lines.push({
            type: "child",
            x1: parent_line_left,
            x2: parent_line_left,
            y1: parent_line_top,
            y2: child_line_top - 20,
            direction: 'vertical'
        });

        this.connection_lines.push({
            type: "child",
            x1: parent_line_left > child_line_left ? child_line_left : parent_line_left,
            x2: parent_line_left > child_line_left ? parent_line_left : child_line_left,
            y1: child_line_top - 20,
            y2: child_line_top - 20,
            direction: 'horizontal'
        });

        this.connection_lines.push({
            type: "child",
            x1: child_line_left,
            x2: child_line_left,
            y1: child_line_top - 20,
            y2: child_line_top,
            direction: 'vertical'
        });
    }

    drawConnectionLines() {
        const personList = this.person_infos.personList;

        this.connection_lines = [];
        personList.map((person_id, i) => {
            if (this.person_positions[person_id] && this.person_positions[person_id].isPositioned) {
                if (this.single_children[person_id] && this.single_children[person_id].children) {

                    //console.log("TreeGraph, drawConnectionLines, person_id:", person_id,
                    //    "this.single_children[person_id].children:", this.single_children[person_id].children);

                    this.single_children[person_id].children.map((child_id, i) => {
                        if (this.person_positions[child_id] && this.person_positions[child_id].isPositioned) {
                            this.drawSingleChildLine(person_id, child_id);
                        }
                    });
                }

                if (this.shared_children[person_id] && this.shared_children[person_id].loverId) {
                    const lover_id = this.shared_children[person_id].loverId;
                    if (lover_id && this.shared_children[person_id].children &&
                        this.person_positions[lover_id] && this.person_positions[lover_id].isPositioned) {
                        this.drawMarriageLine(person_id, lover_id);
                        this.shared_children[person_id].children.map((child_id, i) => {
                            if (this.person_positions[child_id] && this.person_positions[child_id].isPositioned) {
                                this.drawSharedChildLine(person_id, lover_id, child_id);
                            }
                        });
                    }
                }
            }
        });
    }

    calculateMarriageExpandable() {
        const person_list = this.person_infos.personList;

        person_list.filter((person_id, i) => {
            return (this.isPositioned(person_id));
        }).map((person_id, i) => {
            if (this.isMarriageExpandable(person_id)) {
                this.person_positions[person_id].marriage_expand = true;
            }
        });
    }

    calculateParentAndBrothersAndBrothersChildrenPositions(child_person_id, expand_direction) {
        const brother_top = this.person_positions[child_person_id].top;
        const brother_level = this.person_positions[child_person_id].level;

        const origin_left = this.person_positions[child_person_id].left;

        const { father_id, mother_id } = this.getParentId(child_person_id);

        if (!father_id && !mother_id) {
            return;
        }

        const parent_id = (father_id !== '') ? father_id : mother_id;

        let brother_list = [];
        if (father_id && mother_id) {
            brother_list = this.getSharedChildList(father_id, mother_id);
        } else {
            brother_list = this.getSingleChildList(parent_id);
        }

        brother_list = brother_list.filter((child_id, i) => {
            return (child_id !== child_person_id);
        });

        let brother_options = {};

        const { width: brother_width, center: brother_center } = this.getChildrenWidthAndCenterOffset(brother_list);

        // 先不考虑重叠，初步定位儿子辈及孙子辈的起始位置
        const brother_left = (expand_direction === 'left') ?
        origin_left - options.person_margin - brother_width :
        origin_left + options.person_width + options.person_margin;

        const brother_edge = {left: brother_left, right: brother_left + brother_width};
        const brother_child_edge = {left: 0, right: 0};

        let left = brother_left;
        brother_list.map((brother_id, i) => {
            const child_width = this.isMarried(brother_id) ?
                (options.person_width * 2 + options.marriage_margin) :
                options.person_width;

            brother_options[brother_id] = {
                left: left,
                center: left + child_width / 2,
                width: child_width
            };

            left += (child_width + options.person_margin);

            const child_partner_id = this.getPrimaryPartnerId(brother_id);
            const grandchild_list = this.isMarried(brother_id) ?
                this.getSharedChildList(brother_id, child_partner_id) :
                this.getSingleChildList(brother_id);

            const { width: grandchildren_width, center: grandchildren_center } =
                this.getChildrenWidthAndCenterOffset(grandchild_list);

            brother_options[brother_id].children_center = grandchildren_center;
            brother_options[brother_id].children_left = brother_options[brother_id].center - grandchildren_center;
            brother_options[brother_id].children_width = grandchildren_width;

            if (brother_child_edge.left === 0) {
                brother_child_edge.left = brother_options[brother_id].children_left;
            }
            if (brother_options[brother_id].children_left + brother_options[brother_id].children_width >
                brother_child_edge.right) {
                brother_child_edge.right = brother_options[brother_id].children_left +
                    brother_options[brother_id].children_width;
            }
        });
        brother_edge.right = left - options.person_margin;

        // 解决孙子辈的重叠，遇重叠则统一不断向右偏移
        let last_brother_id = '';
        brother_list.map((brother_id, i) => {
            if (i !== 0) {
                const last_children_right = brother_options[last_brother_id].children_left +
                    brother_options[last_brother_id].children_width;

                const current_children_left = brother_options[brother_id].children_left;

                if (current_children_left < last_children_right + options.person_margin) {
                    const offset = last_children_right + options.person_margin - current_children_left;

                    for (let j = i; j < brother_list.length; ++j) {
                        const current_brother_id = brother_list[j];
                        brother_options[current_brother_id].children_center += offset;
                        brother_options[current_brother_id].children_left += offset;
                        brother_options[current_brother_id].left += offset;
                        brother_options[current_brother_id].center += offset;
                    }

                    brother_edge.right += offset;
                    brother_child_edge.right += offset;
                }
            }

            last_brother_id = brother_id;
        });

        // 统一向左偏移，以使孙子辈不压线
        let offset = 0;
        if (expand_direction === 'left') {
            let brother_offset = 0;
            let child_offset = 0;
            if (brother_edge.right + options.person_margin > this.edge_infos[brother_level].left_edge) {
                brother_offset = brother_edge.right + options.person_margin - this.edge_infos[brother_level].left_edge;
            }
            if (brother_child_edge.right !== 0) {
                if (brother_child_edge.right + options.person_margin > this.edge_infos[brother_level + 1].left_edge) {
                    child_offset = brother_child_edge.right + options.person_margin -
                        this.edge_infos[brother_level + 1].left_edge;
                }
            }

            offset = brother_offset > child_offset ? brother_offset : child_offset;
        } else {
            let brother_offset = 0;
            let child_offset = 0;
            if (brother_edge.left - options.person_margin < this.edge_infos[brother_level].right_edge) {
                brother_offset = this.edge_infos[brother_level].right_edge - brother_edge.left + options.person_margin;
            }
            if (brother_child_edge.left !== 0) {
                if (brother_child_edge.left - options.person_margin < this.edge_infos[brother_level + 1].right_edge) {
                    child_offset = this.edge_infos[brother_level + 1].right_edge - brother_child_edge.left +
                        options.person_margin;
                }
            }

            offset = brother_offset > child_offset ? brother_offset : child_offset;
            offset = -offset;
        }

        brother_list.map((brother_id, i) => {
            brother_options[brother_id].children_left -= offset;
            brother_options[brother_id].children_center -= offset;
            brother_options[brother_id].left -= offset;
            brother_options[brother_id].center -= offset;
        });

        brother_edge.left -= offset;
        brother_edge.right -= offset;
        brother_child_edge.left -= offset;
        brother_child_edge.right -= offset;

        // 计算兄弟辈的中心（据此倒推父母的中心）
        // let center_position = 0;

        // brother_list.map((brother_id, i) => {
        //     if (this.isMarried(brother_id)) {
        //         center_position += (this.getPartnerDisplaySide(brother_id) === 'right') ?
        //             (brother_options[brother_id].left + options.person_width / 2) :
        //             (brother_options[brother_id].left + options.person_width * 1.5 + options.marriage_margin);
        //     } else {
        //         center_position += (brother_options[brother_id].left + options.person_width / 2);
        //     }
        // });

        // center_position += (origin_left + options.person_width / 2);
        // center_position = center_position / (brother_list.length + 1);

        const center_position = origin_left + options.person_width / 2;

        // 确定parent级的边界，保存至this.edge_infos
        let parent_edge_left = 0;
        let parent_edge_right = 0;

        if (this.isMarried(parent_id)) {
            parent_edge_left = center_position - options.marriage_margin / 2 -
                options.person_width;
            parent_edge_right = center_position + options.marriage_margin / 2 +
                options.person_width;
        } else {
            parent_edge_left = center_position - options.person_width / 2;
            parent_edge_right = center_position + options.person_width / 2;
        }

        const parent_width = parent_edge_right - parent_edge_left;
        const origin_left_edge = this.edge_infos[brother_level - 1].left_edge;
        const origin_right_edge = this.edge_infos[brother_level - 1].right_edge;

        if (origin_left_edge === origin_right_edge) {
            this.edge_infos[brother_level - 1].left_edge = parent_edge_left;
            this.edge_infos[brother_level - 1].right_edge = parent_edge_right;
        } else {
            if (expand_direction === 'left') {
                if (parent_edge_right + options.person_margin > origin_left_edge) {
                    parent_edge_right = origin_left_edge - options.person_margin;
                    parent_edge_left = parent_edge_right - parent_width;
                }

                if (parent_edge_left < origin_left_edge) {
                    this.edge_infos[brother_level - 1].left_edge = parent_edge_left;
                }
            } else {
                if (parent_edge_left - options.person_margin < origin_right_edge) {
                    parent_edge_left = origin_right_edge + options.person_margin;
                    parent_edge_right = parent_edge_left + parent_width;
                }

                if (parent_edge_right > origin_right_edge) {
                    this.edge_infos[brother_level - 1].right_edge = parent_edge_right;
                }
            }
        }

        // 根据倒推出的中心点，给父母定位
        this.person_positions[parent_id] = {
            top: brother_top - options.generation_margin,
            level: brother_level - 1,
            isPositioned: true
        };

        const parent_center_position = (parent_edge_left + parent_edge_right) / 2;

        if (father_id && mother_id) {
            this.calculateCouplePositionsByCenter(parent_id, parent_center_position, false);
        } else {
            this.person_positions[parent_id].left = parent_center_position - options.person_width / 2;
        }

        // 逐个给儿子辈，孙子辈的每一位定位
        brother_list.map((brother_id, i) => {
            const center = brother_options[brother_id].center;

            this.person_positions[brother_id] = {
                top: brother_top,
                level: brother_level,
                isPositioned: true
            };

            this.calculateCouplePositionsByCenter(brother_id, center);

            const child_partner_id = this.getPrimaryPartnerId(brother_id);
            this.calculateChildrenPositions(brother_id, brother_options[brother_id].children_left,
                this.isMarried(brother_id), child_partner_id);
        });

        // 确定child及grandchild级的边界，保存至this.edge_infos
        if (brother_edge.left !== 0 && brother_edge.left < this.edge_infos[brother_level].left_edge) {
            this.edge_infos[brother_level].left_edge = brother_edge.left;
        }
        if (brother_child_edge.left !== 0 && brother_child_edge.left < this.edge_infos[brother_level + 1].left_edge) {
            this.edge_infos[brother_level + 1].left_edge = brother_child_edge.left;
        }
        if (brother_edge.right !== 0 && brother_edge.right > this.edge_infos[brother_level].right_edge) {
            this.edge_infos[brother_level].right_edge = brother_edge.right;
        }
        if (brother_child_edge.right !== 0 && brother_child_edge.right > this.edge_infos[brother_level].right_edge) {
            this.edge_infos[brother_level + 1].right_edge = brother_child_edge.right;
        }
    }

    calculate3GenerationChildrenPositions(person_id, is_married, partner_id) {
        if (!this.isPositioned(person_id)) {
            return;
        }

        if (is_married && partner_id && !this.isPositioned(partner_id)) {
            return;
        }

        const left = this.person_positions[person_id].left;
        const child_top = this.person_positions[person_id].top + options.generation_margin;
        const child_level = this.person_positions[person_id].level + 1;

        const center = this.getChildCenterOffset(person_id);

        const child_list = (is_married && partner_id) ?
            this.getSharedChildList(person_id, partner_id) : this.getSingleChildList(person_id);

        const { width: children_width, center: children_center_offset } =
            this.getChildrenWidthAndCenterOffset(child_list);

        const children_options = {};

        // 先不考虑重叠，初步定位儿子辈及孙子辈的边界
        let children_left = center - children_center_offset;
        let total_width = 0;
        child_list.map((child_id, i) => {
            const child_width = this.isMarried(child_id) ?
                (options.person_width * 2 + options.marriage_margin) :
                options.person_width;

            const center_offset = this.getCenterOffset(child_id);

            const child_option = {
                left: children_left,
                right: children_left + child_width,
                center: children_left + center_offset,
                children_center: children_left + child_width / 2
            };

            children_left += (child_width + options.person_margin);

            const child_left = child_option.center - options.person_width / 2;
            const children_of_child_options = this.getChildrenAndGrandChildrenRelativeEdges(child_id);

            if (!children_of_child_options) {
                child_option.children_left = child_option.children_center;
                child_option.children_right = child_option.children_center;
            } else {
                child_option.children_left = children_of_child_options.max_left + child_left;
                child_option.children_right = children_of_child_options.max_right + child_left;
            }

            child_option.max_left = Math.min(child_option.left, child_option.children_left);
            child_option.max_right = Math.max(child_option.right, child_option.children_right);

            total_width += (child_option.max_right - child_option.max_left);

            children_options[child_id] = child_option;
        });

        // 统一向左偏移，以消除重叠
        children_left = center - total_width / 2;
        let children_center_new = 0;

        child_list.map((child_id, i) => {
            const child_option = children_options[child_id];
            const offset = child_option.max_left - children_left;

            child_option.left -= offset;
            child_option.right -= offset;
            child_option.center -= offset;
            child_option.children_center -= offset;
            child_option.children_left -= offset;
            child_option.children_right -= offset;
            child_option.max_left -= offset;
            child_option.max_right -= offset;

            children_left += (child_option.max_right - child_option.max_left + options.person_margin);

            children_center_new += child_option.center;
        });

        // 统一偏移，以使儿子辈的中心重新落在正中央
        children_center_new = children_center_new / child_list.length;

        const offset = children_center_new - center;
        child_list.map((child_id, i) => {
            const child_option = children_options[child_id];

            child_option.left -= offset;
            child_option.right -= offset;
            child_option.center -= offset;
            child_option.children_center -= offset;
            child_option.children_left -= offset;
            child_option.children_right -= offset;
            child_option.max_left -= offset;
            child_option.max_right -= offset;

            if (i === 0) {
                children_options.left_edge = child_option.left;
                children_options.max_left = child_option.max_left;
            }
            if (i === child_list.length - 1) {
                children_options.right_edge = child_option.right;
                children_options.max_right = child_option.max_right;
            }
        });

        // 逐个给儿子辈，孙子辈的每一位定位
        child_list.map((child_id, i) => {
            const child_option = children_options[child_id];

            const center = child_option.children_center + left;

            this.person_positions[child_id] = {
                top: child_top,
                level: child_level,
                isPositioned: true
            };

            this.calculateCouplePositionsByCenter(child_id, center);

            const child_partner_id = this.getPrimaryPartnerId(child_id);

            this.calculateChildrenAndGrandChildrenEdges(child_id, this.isMarried(child_id), child_partner_id);
        });

        this.edge_infos[child_level].left_edge = children_options.left_edge + left;
        this.edge_infos[child_level].right_edge = children_options.right_edge + left;
    }

    calculateChildrenAndGrandChildrenEdges(person_id, is_married, partner_id) {
        if (!this.isPositioned(person_id)) {
            return;
        }

        if (is_married && partner_id && !this.isPositioned(partner_id)) {
            return;
        }

        const left = this.person_positions[person_id].left;
        const child_top = this.person_positions[person_id].top + options.generation_margin;
        const child_level = this.person_positions[person_id].level + 1;

        const children_options = this.getChildrenAndGrandChildrenRelativeEdges(person_id);

        if (!children_options) {
            return;
        }

        const child_list = (is_married && partner_id) ?
            this.getSharedChildList(person_id, partner_id) : this.getSingleChildList(person_id);

        // 逐个给儿子辈，孙子辈的每一位定位
        child_list.map((child_id, i) => {
            const child_option = children_options[child_id];

            const center = child_option.children_center + left;

            this.person_positions[child_id] = {
                top: child_top,
                level: child_level,
                isPositioned: true
            };

            this.calculateCouplePositionsByCenter(child_id, center);

            const child_partner_id = this.getPrimaryPartnerId(child_id);
            this.calculateChildrenPositions(child_id, child_option.children_left + left,
                this.isMarried(child_id), child_partner_id);
        });

        this.edge_infos[child_level].left_edge = children_options.left_edge + left;
        this.edge_infos[child_level].right_edge = children_options.right_edge + left;
        this.edge_infos[child_level + 1].left_edge = children_options.children_left_edge + left;
        this.edge_infos[child_level + 1].right_edge = children_options.children_right_edge + left;
    }

    calculateChildrenPositions(person_id, children_left, isMarried, partner_id) {
        const child_list = (isMarried && partner_id) ? this.getSharedChildList(person_id, partner_id) :
            this.getSingleChildList(person_id);

        const child_top = this.person_positions[person_id].top + options.generation_margin;
        const child_level = this.person_positions[person_id].level + 1;

        let left = children_left;
        child_list.map((child_id, i) => {
            const child_width = this.isMarried(child_id) ?
                (options.person_width * 2 + options.marriage_margin) :
                options.person_width;
            const center = left + child_width / 2;

            this.person_positions[child_id] = {
                top: child_top,
                level: child_level,
                isPositioned: true
            };

            if (this.isDownExpandable(child_id)) {
                this.person_positions[child_id].down_expand = true;
            }

            this.calculateCouplePositionsByCenter(child_id, center);

            left += (child_width + options.person_margin);
        })
    }

    calculateCouplePositionsByCenter(person_id, center, is_check_up_expand = true) {
        if (this.isMarried(person_id)) {
            const father_left = center - options.marriage_margin / 2 - options.person_width;
            const mother_left = center + options.marriage_margin / 2;
            const partner_id = this.getPrimaryPartnerId(person_id);
            this.person_positions[partner_id] = assign({}, this.person_positions[person_id]);

            if (this.getPartnerDisplaySide(person_id) === 'right') {
                this.person_positions[person_id].left = father_left;
                this.person_positions[partner_id].left = mother_left;
            } else {
                this.person_positions[partner_id].left = father_left;
                this.person_positions[person_id].left = mother_left;
            }

            if (is_check_up_expand && this.isUpExpandable(partner_id)) {
                this.person_positions[partner_id].up_expand = true;
            }
        } else {
            this.person_positions[person_id].left = center - (options.person_width / 2);
        }
    }

    calculatePartnerPosition(person_id, partner_id, is_check_up_expand = true) {
        const person_position = this.person_positions[person_id];
        if (!person_position || !person_position.isPositioned) {
            return;
        }

        let lover_person_position = {};

        if (this.getPartnerDisplaySide(person_id) === 'right') {
            lover_person_position.left = person_position.left + options.person_width + options.marriage_margin;

            if (this.edge_infos[person_position.level].right_edge < lover_person_position.left + options.person_width){
                this.edge_infos[person_position.level].right_edge = lover_person_position.left + options.person_width;
            }
        } else {
            lover_person_position.left = person_position.left - options.person_width - options.marriage_margin;

            if (this.edge_infos[person_position.level].left_edge > lover_person_position.left) {
                this.edge_infos[person_position.level].left_edge = lover_person_position.left;
            }
        }
        lover_person_position.top = person_position.top;
        lover_person_position.level = person_position.level;
        lover_person_position.isPositioned = true;

        if (is_check_up_expand && this.isUpExpandable(partner_id)) {
            lover_person_position.up_expand = true;
        }

        this.person_positions[partner_id] = lover_person_position;
    }

    arrangeDisplayPositions(person_id) {
        this.connection_lines = [];

        this.person_positions = {};

        // const origin_center = (this.window_width < 768) ?
        //     (this.window_width / 2) :
        //     ((this.window_width + options.left_sidebar_width) / 2);
        const origin_center = this.window_width

        this.edge_infos = {
            "1": {"left_edge": origin_center, "right_edge": origin_center},
            "2": {"left_edge": origin_center, "right_edge": origin_center},
            "3": {"left_edge": origin_center, "right_edge": origin_center},
            "4": {"left_edge": origin_center, "right_edge": origin_center},
            "5": {"left_edge": origin_center, "right_edge": origin_center},
            "6": {"left_edge": origin_center, "right_edge": origin_center},
            "7": {"left_edge": origin_center, "right_edge": origin_center}
        };

        const origin_left = (this.window_width - options.person_width) / 2;
        const origin_top = (this.window_height - options.bottom_sidebar_height - options.person_height) / 2;
        // const origin_left = this.window_width - options.person_width / 2;
        // const origin_top = this.window_height  - options.person_height / 2;

        this.person_positions[person_id] = {
            left: origin_left,
            top: origin_top,
            level: 4,
            isPositioned: true
        };

        this.edge_infos[4].left_edge = origin_left;
        this.edge_infos[4].right_edge = origin_left + options.person_width;

        if (this.isMarried(person_id)) {
            const partner_id = this.getPrimaryPartnerId(person_id);
            this.calculatePartnerPosition(person_id, partner_id, false);

            this.calculate3GenerationChildrenPositions(person_id, true, partner_id);

            if (this.getPartnerDisplaySide(person_id) === 'right') {
                this.calculateParentAndBrothersAndBrothersChildrenPositions(person_id, 'left');
                // this.calculateParentAndBrothersAndBrothersChildrenPositions(partner_id, 'right');
            } else {
                this.calculateParentAndBrothersAndBrothersChildrenPositions(person_id, 'right');
                // this.calculateParentAndBrothersAndBrothersChildrenPositions(partner_id, 'left');
            }

            // const {father_id: partner_father_id, mother_id: partner_mother_id} = this.getParentId(partner_id);
            // if (partner_father_id && this.isUpExpandable(partner_father_id)) {
            //     this.person_positions[partner_father_id].up_expand = true;
            // }
            // if (partner_mother_id && this.isUpExpandable(partner_mother_id)) {
            //     this.person_positions[partner_mother_id].up_expand = true;
            // }
            if (partner_id && this.isUpExpandable(partner_id)) {
                this.person_positions[partner_id].up_expand = true;
            }
        } else {
            this.calculate3GenerationChildrenPositions(person_id);

            if (this.getPartnerDisplaySide(person_id) === 'right') {
                this.calculateParentAndBrothersAndBrothersChildrenPositions(person_id, 'left');
            } else {
                this.calculateParentAndBrothersAndBrothersChildrenPositions(person_id, 'right');
            }
        }

        const { father_id, mother_id } = this.getParentId(person_id);
        if (father_id && this.isPositioned(father_id)) {
            this.calculateParentAndBrothersAndBrothersChildrenPositions(father_id, 'left');
        }
        // if (mother_id && this.isPositioned(mother_id)) {
        //     this.calculateParentAndBrothersAndBrothersChildrenPositions(mother_id, 'right');
        // }
        if (mother_id && this.isUpExpandable(mother_id) && this.isPositioned(mother_id)) {
            this.person_positions[mother_id].up_expand = true;
        }

        const {father_id: grand_father_id, mother_id: grand_mother_id} = this.getParentId(father_id);

        const {father_id: grand_grandfather_id, mother_id: grand_grand_mother_id} = this.getParentId(grand_father_id);

        if (grand_father_id && this.isPositioned(grand_father_id)) {
            this.calculateParentAndBrothersAndBrothersChildrenPositions(grand_father_id, 'left');
        }
        // if (grand_mother_id && this.isPositioned(grand_mother_id)) {
        //     this.calculateParentAndBrothersAndBrothersChildrenPositions(grand_mother_id, 'right');
        // }
        if (grand_mother_id && this.isUpExpandable(grand_mother_id) && this.isPositioned(grand_mother_id)) {
            this.person_positions[grand_mother_id].up_expand = true;
        }

        // const {father_id: mother_father_id, mother_id: mother_mother_id} = this.getParentId(mother_id);
        // if (mother_father_id && this.isUpExpandable(mother_father_id) && this.isPositioned(mother_father_id)) {
        //     this.person_positions[mother_father_id].up_expand = true;
        // }
        // if (mother_mother_id && this.isUpExpandable(mother_mother_id) && this.isPositioned(mother_mother_id)) {
        //     this.person_positions[mother_mother_id].up_expand = true;
        // }

        // const {father_id: grandmother_father_id, mother_id: grandmother_mother_id} = this.getParentId(grand_mother_id);
        // if (grandmother_father_id && this.isUpExpandable(grandmother_father_id) &&
        //     this.isPositioned(grandmother_father_id)) {
        //     this.person_positions[grandmother_father_id].up_expand = true;
        // }
        // if (grandmother_mother_id && this.isUpExpandable(grandmother_mother_id) &&
        //     this.isPositioned(grandmother_mother_id)) {
        //     this.person_positions[grandmother_mother_id].up_expand = true;
        // }

        if (grand_grandfather_id && this.isUpExpandable(grand_grandfather_id) &&
            this.isPositioned(grand_grandfather_id)) {
            this.person_positions[grand_grandfather_id].up_expand = true;
        }
        if (grand_grand_mother_id && this.isUpExpandable(grand_grand_mother_id) &&
            this.isPositioned(grand_grand_mother_id)) {
            this.person_positions[grand_grand_mother_id].up_expand = true;
        }

        this.calculateMarriageExpandable();
        this.drawConnectionLines();
    }
}

export default TreeGraph;
